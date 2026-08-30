export class UserDTO {
    constructor(user) {
        this.id = user._id;
        this.email = user.email;
        this.role = user.role;
    }
}