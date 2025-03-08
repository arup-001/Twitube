import mongoose, {createConnection, isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Provide valid channel id")
    }
    if (channelId.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "Cannot subscribe your own channel");
    }
    try {
        const deletedSubscription = await Subscription.findOneAndDelete(
            {
                subscriber: req.user?._id,
                channel: channelId
            }
        )
        if(deletedSubscription){
            return res
            .status(200)
            .json(
                new ApiResponse(200, deletedSubscription, "Subscription deleted successfully")
            ) 
        }
        const createSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
        if(!createSubscription){
            throw new ApiError(500, "Something went wrong while subscribing")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, createSubscription, "Channel subscribed successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while toggling subscription")
    }
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Provide valid channel id")
    }
    try {
        const subscribersOfChannel = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscribers",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                _id: 1,
                                fullname: 1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$channel",
                    subscribers: { $push: { $arrayElemAt: ["$subscribers", 0] } },
                    subscriberCount: { $sum: 1 },
                },
            }
        ])
        if(!subscribersOfChannel.length){
            throw new ApiError(404, "Subscribers not found")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscribersOfChannel, "Subscribers fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching subscribers")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(400, "Provide valid subscriber id")
    }
    try {
        const subscribedChannels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelDetails",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                avatar: 1,
                                fullname: 1,
                                username: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: "$channelDetails",
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "channel",
                    foreignField: "channel",
                    as: "subscribers",
                },
            },
            {
                $addFields: {
                    channelSubscriberCount: {
                        $size: { $ifNull: ["$subscribers", []] },
                    },
                },
            },
            {
                $group: {
                    _id: "$subscriber",
                    subscribedChannels: {
                        $push: {
                            channelId: "$channel",
                            channelDetails: "$channelDetails",
                            subscriberCount: "$channelSubscriberCount",
                        },
                    },
                    totalSubscribedChannels: { $sum: 1 },
                },
            },
        ])
        if (!subscribedChannels.length) {
            throw new ApiError(404, "No subscribed channels found");
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching subscribed channels")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}