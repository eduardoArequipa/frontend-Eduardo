// src/services/uploadService.ts
import axiosInstance from '../api/axiosInstance';

const UPLOAD_IMAGE_URL = '/uploads/image/'; 

export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file); 

    try {

        const response = await axiosInstance.post(UPLOAD_IMAGE_URL, formData, {
             headers: {
                'Content-Type': 'multipart/form-data', 
             },

        });
        return response.data.file_path; 
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error; 
    }
};