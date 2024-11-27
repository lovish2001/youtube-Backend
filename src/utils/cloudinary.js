import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Public ID is missing for Cloudinary deletion.");
        }

        // Log the public ID to ensure it's correct
        console.log("Attempting to delete image with public ID:", publicId);

        // Log the full URL for debugging purposes
        const fullUrl = `http://res.cloudinary.com/de7u4ktnu/image/upload/v1732598436/${publicId}.jpg`;
        
        console.log("Full URL of avatar:", fullUrl);

        // Call Cloudinary API to delete the image
        const result = await cloudinary.uploader.destroy(publicId);

        // Log the response from Cloudinary
        console.log("Cloudinary Response:", result);

        if (result.result !== "ok") {
            throw new Error(`Cloudinary failed to delete: ${result.result}`);
        }

        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw error;
    }
};


export {uploadOnCloudinary, deleteFromCloudinary}