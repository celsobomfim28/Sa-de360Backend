import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../middlewares/errorHandler';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    list = asyncHandler(async (_req: Request, res: Response) => {
        const users = await this.userService.listUsers();
        res.status(200).json({ data: users });
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const user = await this.userService.getUserById(id);
        res.status(200).json({ data: user });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const updatedUser = await this.userService.updateUser(id, req.body);
        res.status(200).json({
            message: 'Usuário atualizado com sucesso',
            data: updatedUser
        });
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const newUser = await this.userService.createUser(req.body);
        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            data: newUser
        });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.userService.deleteUser(id);
        res.status(200).json({
            message: 'Usuário removido com sucesso'
        });
    });
}
