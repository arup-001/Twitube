import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || name.trim() === ""){
        throw new ApiError(400, "Provide the name for the playlist")
    }
    if(!description || description.trim() === ""){
        throw new ApiError(400, "Provide description for the playlist")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    if(!playlist){
        throw new ApiError(500, "Sommething went wrong while creating the playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist created successfully")
    )
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Provide valid user id")
    }
    const playlists = await Playlist.find({owner: userId})
    if(!playlists){
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "Playlist fetched successfully")
    )
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Provide valid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        return new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist retrieved successfully")
    );
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Provide valid Playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Provide valid video id")
    }
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { 
            _id: playlistId, 
            owner: req.user.id
        },
        { 
            $addToSet: {
                videos: videoId
            } 
        },
        {
            new: true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "Playlist not found or user not authorized to add video in playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Provide a valid playlist ID");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Provide a valid video ID");
    }
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { 
            _id: playlistId, 
            owner: req.user.id
        },
        { 
            $pull: { videos: videoId }
        },
        { 
            new: true,
        }
    );
    if (!updatedPlaylist) {
        throw new ApiError(400, "Playlist not found or user not authorized to modify this playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400, "Provide valid playlist id")
    }
    const deletedPlaylist = await Playlist.findByOneAndDelete(
        { 
            _id: playlistId, 
            owner: req.user.id
        }
    )
    if(!deletedPlaylist){
        throw new ApiError(404, "Playlist not found or user not authorized to delete the playlist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, deletePlaylist, "Playlist deleted successfully")
    )
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Enter valid playlist id")
    }
    const update = {};
    if (name) update.name = name;
    if (description) update.description = description;
    if (Object.keys(update).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { 
            _id: playlistId, 
            owner: req.user.id
        },
        { 
            $set: update 
        },
        {
            new: true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "Playlist not found or user not authorized to update it")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}