import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import { Like } from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Add some content to the tweet")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    if(!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet")
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User id is not valid")
    }
    try {
        const tweets = await Tweet.aggregate(
            [
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: "likes",
                        localField: "_id",
                        foreignField: "tweet",
                        as: "likesOnTweet"
                    }
                },
                {
                    $addFields: {
                        likesCount: {
                            $size: "$likesOnTweet"
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        likesCount: 1,
                        content: 1,
                        createdAt: 1,
                        updatedAt: 1 
                    }
                }
            ]
        )
        res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "Tweets fetched successfully")
        )
    } catch (error) {
        console.error("Error fetching user tweets:", error);
        throw new ApiError(500, "An error occurred while fetching tweets");
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    const {content} = req.body
    if(!content || content?.trim() === "") {
        throw new ApiResponse(400, "Provide the content to be updated")
    }
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set: {
                content,
            }
        },
        {
            new: true
        }
    )
    if(!tweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet")
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet Updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet){
        throw new ApiError(500, "Something went wrong while deleting the tweet")
    }
    await Like.deleteMany({tweet : tweetId})
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}