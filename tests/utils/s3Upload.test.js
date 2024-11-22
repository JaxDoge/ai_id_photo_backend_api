import { uploadToS3 } from "../../utils/s3Upload";

// Mock AWS SDK
jest.mock("aws-sdk", () => {
  const mockUpload = jest.fn();
  const mockPromise = jest.fn();

  const S3 = jest.fn(() => ({
    upload: mockUpload.mockReturnValue({ promise: mockPromise }),
  }));

  return {
    S3,
    mockUpload,
    mockPromise,
  };
});

describe("uploadToS3", () => {
  const mockFileBuffer = Buffer.from("file content");
  const mockUserId = "12345";
  const mockS3Url = "https://mock-s3-url.com/file.png";

  let AWS, mockUpload, mockPromise;

  beforeEach(() => {
    AWS = require("aws-sdk");
    mockUpload = AWS.mockUpload;
    mockPromise = AWS.mockPromise;

    jest.clearAllMocks();
  });

  it("should upload a file to S3", async () => {
    // Mock S3 `upload().promise()` to resolve
    mockPromise.mockResolvedValue({ Location: mockS3Url });

    const result = await uploadToS3(mockFileBuffer, mockUserId);

    expect(result).toBe(mockS3Url);
    expect(mockUpload).toHaveBeenCalledWith({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: expect.any(String),
      Body: mockFileBuffer,
      ContentType: "image/png",
    });
  });

  it("should throw an error if S3 upload fails", async () => {
    // Mock S3 `upload().promise()` to reject
    mockPromise.mockRejectedValue(new Error("Upload failed"));

    await expect(uploadToS3(mockFileBuffer, mockUserId)).rejects.toThrow(
      "Failed to upload image to S3"
    );

    expect(mockUpload).toHaveBeenCalledWith({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: expect.any(String),
      Body: mockFileBuffer,
      ContentType: "image/png",
    });
  });
});

export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // Correctly resolve ES modules with .js extensions
  },
};