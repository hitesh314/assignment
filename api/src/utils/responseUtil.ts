import { Response } from 'express';

class ResponseUtil {
  public static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  public static error(res: Response, error: any, message: string = 'Error', statusCode: number = 500) {
    console.error('Error:', error);
    return res.status(statusCode).json({
      success: false,
      message,
      error: error?.message || error,
    });
  }

  public static badRequest(res: Response, message: string = 'Bad Request') {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  public static notFound(res: Response, message: string = 'Not Found') {
    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export default ResponseUtil;
