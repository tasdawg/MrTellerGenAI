let s3Client: any = null;
let currentConfig: any = {};

export const setS3Config = (config: any) => {
    currentConfig = { ...config };
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
        s3Client = null;
        console.warn("S3 configuration is incomplete. S3 client not initialized.");
        return;
    }
    try {
        // The AWS SDK is loaded from a script tag in index.html
        s3Client = new (window as any).AWS.S3({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            endpoint: config.endpoint,
            region: config.region,
            s3ForcePathStyle: config.s3ForcePathStyle,
            signatureVersion: config.signatureVersion,
            sslEnabled: config.sslEnabled
        });
    } catch(e) {
        console.error("Failed to initialize S3 client:", e);
        s3Client = null;
    }
};

const getS3Client = () => {
    if (!s3Client) {
        throw new Error("S3 client is not configured. Please check your S3 settings in the Collection tab.");
    }
    return s3Client;
};

export const testS3Connection = (config: any): Promise<boolean> => {
    const testClient = new (window as any).AWS.S3({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        endpoint: config.endpoint,
        region: config.region,
        s3ForcePathStyle: config.s3ForcePathStyle,
        signatureVersion: config.signatureVersion,
        sslEnabled: config.sslEnabled
    });
    const params = { Bucket: config.bucketName, MaxKeys: 1 };

    return new Promise((resolve, reject) => {
        testClient.listObjectsV2(params, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

export const getPublicUrl = (key: string) => {
    if (!currentConfig.endpoint || !currentConfig.bucketName) return '';
    return `${currentConfig.endpoint}/${currentConfig.bucketName}/${key}`;
};

export const uploadToS3 = async ({ key, body, contentType }: { key: string, body: Blob, contentType: string }): Promise<void> => {
    const s3 = getS3Client();
    const params = {
        Bucket: currentConfig.bucketName,
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
    const params = { Bucket: currentConfig.bucketName };

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
    const params = { Bucket: currentConfig.bucketName, Key: key };

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
