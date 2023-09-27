const qs = require('querystring')
var Jimp = require("jimp");

const AWS = require('aws-sdk');

AWS.config.update({region: 'ap-northeast-2'});

const s3 = new AWS.S3()

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const { w } = qs.parse(request.querystring)
    const width = parseInt(w)
    
    if (Number.isNaN(width)) {
        callback(null, request)
        return
    }


    s3.getObject({
        Bucket: "wsi-objects",
        Key: request.uri.replace('/', '')
    }, (_, object) => {
        const contentType = object.ContentType
        Jimp.read(object.Body)
            .then((jimp) => {
                jimp
                    .resize(width, Jimp.AUTO)
                    .getBase64(contentType, (_, result) => {
                        const response = {
                            status: '200',
                            statusDescription: 'OK',
                            headers: {
                                'cache-control': [{
                                    key: 'Cache-Control',
                                    value: 'max-age=100'
                                }],
                                'content-type': [{
                                    key: 'Content-Type',
                                    value: contentType
                                }]
                            },
                            body: result.replace(`data:${contentType};base64,`, ''),
                            bodyEncoding: 'base64'
                        };

                        callback(null, response);
                    })
            })
    })


};
