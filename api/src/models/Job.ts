import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  job_id: string;
  url?: string;
  text?: string;
  status: number;
  summary?: string;
  cached: boolean;
  processing_time_ms?: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

const JobSchema: Schema = new Schema(
  {
    job_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      default: null,
    },
    text: {
      type: String,
      default: null,
    },
    status: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    summary: {
      type: String,
      default: null,
    },
    cached: {
      type: Boolean,
      default: false,
    },
    processing_time_ms: {
      type: Number,
      default: null,
    },
    error_message: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model<IJob>('Job', JobSchema);
