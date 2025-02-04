declare module '@vimeo/vimeo' {
  export class Vimeo {
    constructor(clientId: string, clientSecret: string, accessToken: string);
    
    request(
      options: {
        method: string;
        path: string;
        query?: Record<string, string>;
      },
      callback: (
        error: Error | null,
        body: any,
        statusCode: number,
        headers: Record<string, string>
      ) => void
    ): void;
  }
} 