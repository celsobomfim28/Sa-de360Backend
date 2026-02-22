import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    login = async (req: Request, res: Response) => {
        const { cpf, password } = loginSchema.parse(req.body);

        const result = await this.authService.login(cpf, password);

        res.status(200).json(result);
    };

    refresh = async (req: Request, res: Response) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token não fornecido',
                },
            });
        }

        const result = await this.authService.refreshToken(token);

        return res.status(200).json(result);
    };

    logout = async (_req: Request, res: Response) => {
        // TODO: Implementar blacklist de tokens (Redis)
        res.status(200).json({
            message: 'Logout realizado com sucesso',
        });
    };
}
