import Router from 'express';
import userController from '../controllers/user.controller.js';
const router = Router();

router.route("/login").post(userController.login)
router.route("/register").post(userController.register)
router.route("/add_to_activity").post(userController.addToHistory)
router.route("/get_all_activity").get(userController.getUserHistory)

export default router;

