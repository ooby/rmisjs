const visit = {
    type: 'object',
    properties: {
        dateTime: {
            type: 'string',
            pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}\+\d{2}:\d{2}/.source,
        },
        placeServicesCode: {
            type: 'string',
            pattern: /^\d+$/.source
        },
        purposeVisitCode: {
            type: 'string',
            pattern: /^\d+$/.source
        }
    }
};

module.exports = {
    type: 'object',
    required: [
        'resultCode',
        'outcomeCode',
        'visit',
        'paymentData',
        'Services',
        'mainDiagnosisCode',
        'characterDiagnosisCode',
        'concomitantDiagnosis'
    ],
    properties: {
        resultCode: {
            type: 'string',
            format: /^\d+$/.source
        },
        outcomeCode: {
            type: 'string',
            format: /^\d+$/.source
        },
        visit
    }
};