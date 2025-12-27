import { Request, Response } from 'express';
import jobService from '../services/jobService';
import ResponseUtil from '../utils/responseUtil';

class JobController {
  public async submitJob(req: Request, res: Response): Promise<Response> {
    try {
      const { url, text } = req.body;

      if (!url && !text) {
        return ResponseUtil.badRequest(res, 'Either url or text must be provided');
      }

      const result = await jobService.submitJob(url, text);

      return ResponseUtil.success(res, result, 'Job submitted successfully', 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error, error.message || 'Failed to submit job', 500);
    }
  }

  public async getStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const result = await jobService.getJobStatus(id);

      if (!result) {
        return ResponseUtil.notFound(res, 'Job not found');
      }

      if (result.status === 'failed') {
        const errorMessage = result.error_message || 'Job processing failed';
        return res.status(422).json({
          success: false,
          message: errorMessage,
          data: result,
        });
      }

      return ResponseUtil.success(res, result, 'Job status retrieved successfully');
    } catch (error: any) {
      return ResponseUtil.error(res, error, 'Failed to get job status', 500);
    }
  }

  public async getResult(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const result = await jobService.getJobResult(id);

      if (!result) {
        return ResponseUtil.notFound(res, 'Job not found');
      }

      if (result.status === 'failed') {
        const errorMessage = result.error_message || 'Job processing failed';
        return res.status(422).json({
          success: false,
          message: errorMessage,
          data: result,
        });
      }

      if (result.status === 'queued' || result.status === 'processing') {
        return res.status(202).json({
          success: false,
          message: result.message,
          data: result,
        });
      }

      return ResponseUtil.success(res, result, 'Job result retrieved successfully');
    } catch (error: any) {
      return ResponseUtil.error(res, error, 'Failed to get job result', 500);
    }
  }
}

export default new JobController();
