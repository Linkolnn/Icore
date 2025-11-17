/**
 * JWT Payload Interface
 *
 * Данные, которые хранятся в JWT токене
 */
export interface UserPayload {
  /**
   * User ID (sub = subject в JWT терминологии)
   */
  sub: string;

  /**
   * Username
   */
  username: string;

  /**
   * Email
   */
  email: string;
}
