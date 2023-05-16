import { CustomException } from "./customExeption.js";

export class ResourceNotFoundException extends CustomException {
    constructor(message: string) {
        super('ResourceNotFoundException', message);
    }
}

