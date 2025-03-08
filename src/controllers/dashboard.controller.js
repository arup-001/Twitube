import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelID = req.user?._id;
    if(!channelID){
        throw new ApiError(409, "User not authorized")
    }
    try {
        const videoStats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelID)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likesData",
                },
            },
            {
                $addFields: {
                    likesCount: {
                        $size: {$ifNull: ["$likesData", []]}
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalVideos: { $count: {} },
                    totalLikes: { $sum: "$likesCount" },
                },
            }
        ])
        const totalSubscribers = await Subscription.countDocuments({
            channelId: channelID
        })
        const channelStats = {
            totalViews: videoStats[0]?.totalViews || 0,
            totalVideos: videoStats[0]?.totalVideos || 0,
            totalLikes: videoStats[0]?.totalLikes || 0,
            totalSubscribers: totalSubscribers || 0,
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, channelStats, "Channel stats fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching channel stats")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelID = req.user?._id;
    if(!channelID) {
        throw new ApiError(409, "User not authorized")
    }
    try {
        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelID)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "videoLikes"
                }
            },
            {
                $addFields: {
                    totalLikes: {
                        $size: {$ifNull: ["$videoLikes", []]}
                    }
                }
            },
            {
                $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    totalLikes: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ])
        return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Channel videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while getting channel videos")
    }

})

export {
    getChannelStats, 
    getChannelVideos
}