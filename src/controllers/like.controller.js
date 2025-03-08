import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id is not valid")
    }
    try {
        const likedVideo = await Like.findOneAndDelete({
            likedBy: req.user?._id,
            video: videoId
        })
        if(likedVideo) {
            return res
            .status(200)
            .json(
                new ApiResponse(200, likedVideo, "Like removed from the video successfully")
            )
        }
        const newLikeVideo = await Like.create({
            likedBy: req.user?._id,
            video: videoId
        })
        if(!newLikeVideo){
            throw new ApiError(500, "Something went wrong while adding like to the video")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, newLikeVideo, "Like added successfully to the video")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while toggling like on the video.")
    }
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment id is not valid")
    }
    try {
        const commentedLike = await Like.findOneAndDelete({
            likedBy: req.user?._id,
            comment: commentId
        })
        if(commentedLike) {
            return res
            .status(200)
            .json(
                new ApiResponse(200, commentedLike, "Like removed from the comment successfully")
            )
        }
        const newCommentLike = await Like.create({
            likedBy: req.user?._id,
            comment: commentId
        })
        if(!newCommentLike){
            throw new ApiError(500, "Something went wrong while adding like to the comment")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, newCommentLike, "Like added successfully to the comment")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while toggling like on the comment.")
    }
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet id is not valid")
    }
    try {
        const tweetedLike = await Like.findOneAndDelete({
            likedBy: req.user?._id,
            tweet: tweetId
        })
        if(tweetedLike) {
            return res
            .status(200)
            .json(
                new ApiResponse(200, tweetedLike, "Like removed from the tweet successfully")
            )
        }
        const newTweetLike = await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId
        })
        if(!newTweetLike){
            throw new ApiError(500, "Something went wrong while adding like to the tweet")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, newTweetLike, "Like added successfully to the tweet")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while toggling like on the tweet.")
    }
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    $and: [
                        {
                            likedBy: new mongoose.Types.ObjectId(req.user?._id)
                        },
                        {
                            video: { $ne: null }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            avatar: 1,
                                            username: 1,
                                            fullname: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: { $first: "$owner" }
                            }
                        },
                        {
                            $project: {
                                videoFile: 1,
                                thumbnail: 1,
                                owner: 1,
                                _id: 1,
                                title: 1,
                                views: 1,
                                duration: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$likedVideo"
            },
            {
                $project: {
                    likedBy: 1,
                    video: 1,
                    likedVideo: 1
                }
            }
        ]);
        return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching liked videos")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}