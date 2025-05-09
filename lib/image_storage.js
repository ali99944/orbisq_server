import { host, is_development, port } from "./configs.js";

export const getUploadedImagePath = (req) => {
    if(is_development) {
        return `${host}:${port}${req.file.path}`
    }

    return `${host}/${req.file.path}`
}
