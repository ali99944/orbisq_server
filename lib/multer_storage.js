import multer from 'multer';
import path from 'path';
import Randomstring from 'randomstring';
import fs from 'fs';

const createMulterStorage = (resource = 'images', directory) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const dirPath = `public/${resource}/${directory}`;
            fs.mkdirSync(dirPath, { recursive: true });
            cb(null, `${resource}/${directory}`);
        },
        filename: function (req, file, cb) {
            cb(null, `${directory}_${Randomstring.generate(10)}${path.extname(file.originalname.replace(/\s/g, ''))}`);
        }
    });

    return multer({ storage });
};

export {
    createMulterStorage
}

