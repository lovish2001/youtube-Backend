import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    console.log("Query Params:", req.query);

    const { page = 1, limit = 10, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    console.log("Query Params after :", req.query);
    console.log("Received userId : ", userId);
    if (userId && !isValidObjectId(userId)) {
        throw new ApiError('Invalid userId', 400)
    }

    const videos = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId), // Match the user by `userId`
            },
        },
        {
            $lookup: {
                from: "videos", 
                localField: "_id",
                foreignField: "owner",
                as: "userVideos" 
            }
        },
        {
            $project: {           
                _id: 0,           
                // username: 1,      
                // userVideos: 1 
                // if you want only video
                userVideos: {
                    $map: {
                        input: "$userVideos",
                        as: "video",
                        in: "$$video.videoFile" // Extract only the `videofile` field from each tweet
                    }
                } 
            }
        }
    ])

    console.log("video aggregation : ", videos);
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "User videos fetched successfully")
    )
    
})


const publishAVideo = asyncHandler(async (req, res) => {
    console.log("in publish video");
    console.log("req.files: ", req.files);
    
    const { title, description } = req.body;

    // Validate required fields
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required.");
    }

    // Validate video and thumbnail file presence
    const videolocalpath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    console.log("video local path  : ", videolocalpath);
    

    if (!videolocalpath) {
        throw new ApiError(400, "A video file is required.");
    }

    if (!thumbnailPath) {
        throw new ApiError(400, "A thumbnail image is required.");
    }

    // Upload video to Cloudinary
    const videoFile = await uploadOnCloudinary(videolocalpath);
    if (!videoFile || !videoFile.url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary.");
    }

    // Upload thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!thumbnail || !thumbnail.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary.");
    }

    // Save video details in the database
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration: videoFile.duration || 0,
        views: videoFile.views || 0,
        isPublished: false,
    });

    if (!video) throw new ApiError(500, 'Error creating video')


    // Return success response with video details
    return res.status(200).json(
        new ApiResponse(200, video, "Video published successfully.")
    );    
});


const getVideoById = asyncHandler(async (req, res) => {
    console.log("hello in get video by id");
    
    const { videoId } = req.params
    //TODO: get video by id
    console.log("video id : ", videoId);
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "video not available")
    }
    

    return res.status(200).json(
        new ApiResponse(200, video.videoFile , "Video fetched successfully.")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required.");
    }

    const thumbnailPath = req.file?.path
    if (!thumbnailPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment
    const delvideo = await Video.findById(videoId)
    if (delvideo.thumbnail) {
        const publicId = delvideo.thumbnail.split('/').pop().split('.')[0];
        try {
            await deleteFromCloudinary(publicId); 
        } catch (error) {
            console.error("Failed to delete old avatar:", error);
            throw new ApiError(500, "Failed to delete old avatar from Cloudinary");
        }
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        {new: true}
    )
    console.log("video to update : ", videoId);

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.find({ videoId });

    if(!video){
        throw new ApiError(400, "user not valid")
    }
    await Video.deleteOne({ _id: videoId });

    return res
    .status(200)
    .json(new ApiResponse(200, "video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // console.log("videoId:", videoId);
    // Check if videoId is valid
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    const togglevideo = await Video.findById(videoId)

    // console.log("togglevideo :", togglevideo);


    if (!togglevideo) {
        console.log("Video not found for videoId:", videoId);
        return res.status(404).json({ message: "Video not found" });
    }

    console.log("videoId:", videoId);

    const isPublished = !togglevideo.isPublished;

    // console.log("isPublished:", isPublished);

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished } },
        { new: true } 
    );

    return res.status(200).json(new ApiResponse(200, video, "Published toggle successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}