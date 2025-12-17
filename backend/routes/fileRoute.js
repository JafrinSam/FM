import { Router } from 'express';
import { 
    uploadMusicFiles,
    listMusicAssets,
    getMusicAssetById,
    updateMusicAsset,
    deleteMusicAsset
} from '../controller/fileController.js';

const router = Router();

// 1. CREATE (Upload)
router.post('/upload', uploadMusicFiles); 

// 2. READ (List and Get)
router.get('/', listMusicAssets);
router.get('/:id', getMusicAssetById);

// 3. UPDATE (Metadata)
router.put('/:id', updateMusicAsset);

// 4. DELETE (Record and Physical File)
router.delete('/:id', deleteMusicAsset);

export default router;