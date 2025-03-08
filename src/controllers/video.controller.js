import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, cloudinaryDelete} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(!query){
        throw new ApiError(400, "Enter the query to get videos")
    }
    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    {
                        title: {$regex: query, $options: "i"}
                    },
                    {
                        description: {$regex: query, $options: "i"}
                    }
                ]
            }
        },
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
            $project: {
                videoFile: 1,
                thumbnail: 1,
                owner: 1,
                _id: 1,
                title: 1,
                views: 1,
                duration: 1,
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit
        },

        {
            $limit: parseInt(limit)
        }
    ])
    if(!videos.length) {
        throw new ApiError(404, `no videos found by "${query}"`);
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title || !description || title.trim() === "") {
        throw new ApiError(400, "Provide title and description");
    }
    if(!req.files?.videoFile || !req.files?.thumbnail){
        throw new ApiError(400, "No video or thumbnail")
    }
    const videoLocalPath = req.files?.videoFile[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400, "Video file not found")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail not found")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile.url){
        throw new ApiError(500, "Error while uploading video on cloudinary")
    }
    if(!thumbnail.url){
        throw new ApiError(500, "Error while uploading thumbnail on cloudinary")
    }
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id
    })
    if(!video){
        throw new ApiError(500, "Something went wrong while publishing the video")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video published successfully")
    )
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID format")
    }
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "like"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$like"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, { $ifNull: ["$like.likedBy", []]}]},
                        then: true,
                        else: false
                    } 
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "owner",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: { $ifNull: ["$subscribers", []] }
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [req.user?._id, { $ifNull: ["$subscribers.subscriber", []]}]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                            avatar: 1,
                            coverImage: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "video",
                foreignField: "_id",
                as: "comments"
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
                owner: 1,
                createdAt: 1,
                comments: 1,
                likesCount: 1,
                isLiked: 1,
            }
        }
    ])
    if (!video.length) {
        throw new ApiError(404, "Video not found");
    }
    await Promise.all([
        Video.findByIdAndUpdate(
            videoId,
            {
                $inc:{
                    views: 1
                }
            }
        ),
        User.findByIdAndUpdate(
            req.user?._id,
            {
                $addToSet: {
                    watchHistory: videoId
                },
            }
        ),
    ])
    return res.status(200).json(
        new ApiResponse(
            200,
            video[0],
            "Video fetched successfully"
        )
    )
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    let { title, description } = req.body;
    let newThumbnail = video.thumbnail;
    if (req.file && req.file.path) {
        const thumbnailLocalPath = req.file.path;
        const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!uploadThumbnail) {
            throw new ApiError(400, "Error while uploading thumbnail");
        }
        newThumbnail = uploadThumbnail.url;
        await cloudinaryDelete(video.thumbnail, 'image');
    }
    if (!title && !description && newThumbnail === video.thumbnail) {
        throw new ApiError(409, "No updates required");
    }
    title = title || video.title;
    description = description || video.description;
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: newThumbnail,
            },
        },
        {
            new: true
        }
    );
    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong while updating the video");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
    //TODO: update video details like title, description, thumbnail
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video id not valid")
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }
    await Promise.all([
        Comment.deleteMany(
            {
                video: videoId
            }
        ),
        Like.deleteMany(
            {
                video: videoId
            }
        ),
        User.updateMany(
            {
                watchHistory: videoId
            },
            {
                $pull: {
                    watchHistory: videoId
                }
            }
        ),
        Playlist.updateMany(
            {
                videos: videoId
            },
            {
                $pull: {
                    videos: videoId
                }
            }
        ),
        cloudinaryDelete(deletedVideo.thumbnail, 'image'),
        cloudinaryDelete(deletedVideo.videoFile, 'video'),
    ]);
    return res
    .status(200)
    .json(
        200, deletedVideo, "Video deleted successfully"
    )
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findByIdAndUpdate(videoId, 
        [
            {
                $set: {
                    isPublished:
                    {
                        $not: "$isPublished"
                    }
                }
            }
        ],
        {
            new: true
        }
    )
    if(!video){
        throw new ApiError(500, "Something went wrong after toggling")
    }
    return res
    .status(200)
    .json(
        200, video, "isPublished is toggled successfully"
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}