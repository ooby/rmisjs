exports.getSchedFormat = d => {
    return {
        'ct:scheduleDate': d.scheduleDate,
        'ct:muCode': d.muCode,
        'ct:needFIO': d.needFIO
    };
};

exports.schedFormat = d => {
    let data = {
        'ct:scheduleDate': d.scheduleDate,
        'ct:muCode': d.muCode,
        'ct:deptCode': d.deptCode,
        'ct:roomNumber': d.roomNumber,
        'ct:docCode': d.docCode,
        'ct:specCode': d.specCode,
        'ct:positionCode': d.positionCode,
        'ct:docSNILS': d.docSNILS
    };
    if (d.SlotElement) data['pt:SlotElement'] = d.SlotElement;
    return data;
};

exports.schedFormatStruct = d => {
    return {
        'ct:scheduleDate': d.scheduleDate,
        'ct:muCode': d.muCode,
        'ct:deptCode': d.deptCode,
        'ct:roomNumber': d.roomNumber,
        'ct:docCode': d.docCode,
        'ct:specCode': d.specCode,
        'ct:positionCode': d.positionCode
    };
};

exports.slotFormat = d => {
    return {
        'ct:timeInterval': {
            'ct:timeStart': d.timeStart,
            'ct:timeFinish': d.timeFinish
        },
        'ct:slotType': d.slotType,
        'ct:slotInfo': {
            'ct:GUID': d.GUID,
            'ct:SlotState': d.SlotState
        }
    };
};

exports.roomFormat = d => {
    return {
        'pt:muCode': d.muCode,
        'pt:deptCode': d.deptCode,
        'pt:roomInfo': {
            'ct:roomNumber': d.roomNumber,
            'ct:deleted': d.deleted
        }
    };
};

exports.empFormat = d => {
    return {
        'ct:docCode': d.docCode,
        'ct:snils': d.snils,
        'ct:firstName': d.firstName,
        'ct:middleName': d.middleName,
        'ct:lastName': d.lastName,
        'ct:specCode': d.specCode,
        'ct:positionCode': d.positionCode,
        'pt:muCode': d.muCode
    };
};

exports.deptFormat = d => {
    return {
        'ct:deptCode': d.deptCode,
        'ct:deptName': d.deptName,
        'ct:deptType': d.deptType,
        'ct:deleted': d.deleted
    };
};
