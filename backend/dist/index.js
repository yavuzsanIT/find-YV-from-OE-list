"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// routes
app.use("/api", uploadRoutes_1.default);
// health check
app.get("/", (_req, res) => {
    res.send("Backend is running 🚀");
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
