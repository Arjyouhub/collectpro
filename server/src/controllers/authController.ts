import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, password, phone, role, agentCode } = request.body as any;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return reply.status(400).send({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = agentCode || `AG-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role || 'Executive',
      agentCode: code
    });

    const token = (request as any).server.jwt.sign({
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
  } catch (error: any) {
    return reply.status(500).send({ error: 'Registration failed', message: error.message });
  }
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = (request as any).server.jwt.sign({
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
  } catch (error: any) {
    return reply.status(500).send({ error: 'Login failed', message: error.message });
  }
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return reply.send({ user });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Failed to fetch profile', message: error.message });
  }
}
