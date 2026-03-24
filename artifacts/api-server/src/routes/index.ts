import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pointsRouter from "./points";
import redemptionsRouter from "./redemptions";
import notificationsRouter from "./notifications";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(pointsRouter);
router.use(redemptionsRouter);
router.use(notificationsRouter);
router.use(chatRouter);

export default router;
