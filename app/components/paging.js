"use strict";

exports.parseParameters = function (req) {
    var paging = {
        skip: 0,
        count: 10
    };

    var skip = parseInt(req.query.skip);
    if (!isNaN(skip) && skip >= 0) {
        paging.skip = skip;
    }

    var count = parseInt(req.query.count);
    if (!isNaN(count) && count > 0) {
        paging.count = count
    }

    return paging;
}
