import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryDelete = async (fileToDeleteUrl, type) => {
    return new Promise((resolve, reject) => {
        try {
            // Extract public_id from the URL
            const publicId = fileToDeleteUrl.split("/").pop().split(".")[0]
            cloudinary.uploader.destroy(publicId, 
                {
                    resource_type: type 
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary deletion error: ', error);
                        reject(error);
                    } else {
                        console.log('Deletion result: ', result);
                        resolve(result);
                    }
                }
            );
        } catch (err) {
            console.error('Error processing fileToDeleteUrl: ', err);
            reject(err);
        }
    });
};

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: "auto"
            }
        )
        if(response?.secure_url) {
            console.log('File uploaded successfully:', response.secure_url);
            fs.unlinkSync(localFilePath);
            return response;
        } else {
            console.error('Upload failed', response);
            fs.unlinkSync(localFilePath); // Remove the local file if upload failed
            return null;
        }
    } catch(error) {
        console.error('Error uploading file to Cloudinary:', error);
        fs.unlinkSync(localFilePath); // Remove the local file in case of error
        return null;
    }
}

export {uploadOnCloudinary, cloudinaryDelete}