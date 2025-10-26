// IMPORTANT: Storing credentials in client-side code is a major security risk.
// These should be managed via a backend service and secure authentication method in a production environment.
const S3_CONFIG = {
    accessKeyId: 'lCEixOmQYBNv7X3eGanD',
    secretAccessKey: 'VGvgJxlfpm3J4COaH0KDaFQyHHrQNaucs7OIUMKh',
    endpoint: 'http://100.85.22.130:9000', // MiniIO S3 API endpoint
    bucketName: 'image-gen',
    region: 'us-east-1', // Default region, can be anything for MiniIO
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
};

let s3Client: any = null;

const getS3Client = () => {
    if (!s3Client) {
        // The AWS SDK is loaded from a script tag in index.html, so it's available on the window object.
        s3Client = new (window as any).AWS.S3({
            accessKeyId: S3_CONFIG.accessKeyId,
            secretAccessKey: S3_CONFIG.secretAccessKey,
            endpoint: S3_CONFIG.endpoint,
            region: S3_CONFIG.region,
            s3ForcePathStyle: S3_CONFIG.s3ForcePathStyle,
            signatureVersion: S3_CONFIG.signatureVersion,
            sslEnabled: false // Force HTTP connection for non-SSL endpoints like MiniIO
        });
    }
    return s3Client;
};

export const getPublicUrl = (key: string) => {
    return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucketName}/${key}`;
}

export const uploadToS3 = async ({ key, body, contentType }: { key: string, body: Blob, contentType: string }): Promise<void> => {
    const s3 = getS3Client();
    const params = {
        Bucket: S3_CONFIG.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read' // Make file publicly accessible
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err: any, data: any) => {
            if (err) {
                console.error("S3 Upload Error:", err);
                reject(err);
            } else {
                console.log("S3 Upload Success:", data.Location);
                resolve();
            }
        });
    });
};

export const listFromS3 = async (): Promise<any[]> => {
    const s3 = getS3Client();
    const params = { Bucket: S3_CONFIG.bucketName };

    return new Promise((resolve, reject) => {
        s3.listObjectsV2(params, (err: any, data: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Contents || []);
            }
        });
    });
};

export const getFromS3 = async (key: string): Promise<string> => {
    const s3 = getS3Client();
    const params = { Bucket: S3_CONFIG.bucketName, Key: key };

    return new Promise((resolve, reject) => {
        s3.getObject(params, (err: any, data: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Body.toString('utf-8'));
            }
        });
    });
};

export const base64ToBlob = (base64: string, contentType: string = ''): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};
