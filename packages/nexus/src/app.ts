/**
 * Elysia 应用实例创建与组装
 * 分离应用创建和服务器启动，便于测试
 */
import { Elysia } from 'elysia'
import { bootstrap } from './core/bootstrap'

export const app = new Elysia()

bootstrap(app)
