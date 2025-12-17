import {Router} from 'express'
const router= Router()
import  Schedule from "./scheduleRouter.js"
import gain from "./gainRouter.js"
import queue from "./queueRouter.js"
import file from "./fileRoute.js"


router.use('/schedules',Schedule);
router.use('/gain',gain);
router.use('/queue',queue);
router.use("/file",file)

export default router