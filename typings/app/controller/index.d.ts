// This file is created by egg-ts-helper@1.30.3
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportApply = require('../../../app/controller/apply');
import ExportChat = require('../../../app/controller/chat');
import ExportCommon = require('../../../app/controller/common');
import ExportFava = require('../../../app/controller/fava');
import ExportFriend = require('../../../app/controller/friend');
import ExportGroup = require('../../../app/controller/group');
import ExportHome = require('../../../app/controller/home');
import ExportMoment = require('../../../app/controller/moment');
import ExportReport = require('../../../app/controller/report');
import ExportSearch = require('../../../app/controller/search');
import ExportTag = require('../../../app/controller/tag');
import ExportUser = require('../../../app/controller/user');

declare module 'egg' {
  interface IController {
    apply: ExportApply;
    chat: ExportChat;
    common: ExportCommon;
    fava: ExportFava;
    friend: ExportFriend;
    group: ExportGroup;
    home: ExportHome;
    moment: ExportMoment;
    report: ExportReport;
    search: ExportSearch;
    tag: ExportTag;
    user: ExportUser;
  }
}
