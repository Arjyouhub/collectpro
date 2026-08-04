"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
async function register(request, reply) {
    try {
        const { name, email, password, phone, role, agentCode } = request.body;
        if (!name || !email || !password) {
            return reply.status(400).send({ error: 'Name, email, and password are required' });
        }
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return reply.status(400).send({ error: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const code = agentCode || `AG-${Math.floor(1000 + Math.random() * 9000)}`;
        const user = await User_1.default.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            role: role || 'Executive',
            agentCode: code
        });
        const token = request.server.jwt.sign({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            agentCode: user.agentCode
        });
        return reply.send({
            message: 'Executive registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                agentCode: user.agentCode,
                role: user.role
            }
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Registration failed', message: error.message });
    }
}
async function login(request, reply) {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.status(400).send({ error: 'Email and password are required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
        const token = request.server.jwt.sign({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            agentCode: user.agentCode
        });
        return reply.send({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                agentCode: user.agentCode,
                role: user.role
            }
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Login failed', message: error.message });
    }
}
async function getProfile(request, reply) {
    try {
        const userId = request.user.id;
        const user = await User_1.default.findById(userId).select('-password');
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        return reply.send({ user });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Failed to fetch profile', message: error.message });
    }
}
