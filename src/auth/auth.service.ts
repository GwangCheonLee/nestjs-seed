import {ConflictException, Injectable} from '@nestjs/common';
import {UserRepository} from '../users/repositories/user.repository';
import {hashPlainText} from '../common/constants/encryption.constant';
import {User} from '../users/entities/user.entity';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {AuthenticatedUser} from './interfaces/auth.interface';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {user: this.extractPayloadFromUser(user)},
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      },
    );
  }

  async signUp(
    signUpRequestBodyDto: SignUpRequestBodyDto,
  ): Promise<AuthenticatedUser> {
    const emailExists = await this.userRepository.isEmailRegistered(
      signUpRequestBodyDto.email,
    );

    if (emailExists) {
      throw new ConflictException(
        'This email is already registered. Please use another email.',
      );
    }

    const hashedPassword = await hashPlainText(signUpRequestBodyDto.password);

    const user = await this.userRepository.signUp(
      signUpRequestBodyDto.email,
      hashedPassword,
      signUpRequestBodyDto.nickname,
    );

    return this.extractPayloadFromUser(user);
  }

  private extractPayloadFromUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }
}
