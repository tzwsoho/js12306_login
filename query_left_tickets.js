
'use strict';

const request = require('request');

const jar = request.jar();

var stations = {};

const config = {
	// 自己打开 12306 官网主页获取对应的 Cookie 字段
	'RAIL_EXPIRATION': '1640339206433',
	'RAIL_DEVICEID': 'jhj5fAgLckRdVsjTYpEodl3joDjd2srNWgsW76xH5Nysv2gJZUO25tQa1MHy2g1deWtNmxhmn7aV0DR5PboNFxL-VOy5-4676bn4Cbk9X4OmoIU8dF8qdmPm1dhXGiU5mZBzwFJJWGee5l9beFBFL0FoXkiS98Ra',

	'train_dates': ['2022-01-01'],
	'from': '广州南',
	'to': '上海虹桥',
}

const get = function (url, headers, cb) {
	request.defaults({ jar: true });
	request({ url: url, headers: headers, jar: jar, timeout: 20000 }, (err, res, html) =>
	{
		cb(err, html);
	});
};

const post = function (url, form, headers, cb) {
	request.defaults({ jar: true });
	request.post({ url: url, headers: headers, jar: jar, form: form, timeout: 20000 }, (err, res, html) =>
	{
		cb(err, html);
	});
};

function ConvertPosition(points) {
	const Table = [
		[39, 45], [111, 45], [183, 45], [255, 45],
		[39, 118], [111, 118], [183, 118], [255, 118]
	];

	var ret = '';
	for (const point of points) {
		ret += (Table[point - 1][0] + Math.floor(Math.random() * 20 - 10)) + ',' +
			(Table[point - 1][1] + Math.floor(Math.random() * 20 - 10)) + ',';
	}

	return ret.substring(0, ret.length - 1);
}

function InitStations() {
	get('https://kyfw.12306.cn/otn/resources/js/framework/station_name.js', {
		'Origin': 'https://kyfw.12306.cn',
		'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
	}, function (err1, html1) {
		if (err1) {
			console.log('err1', err1);
			return;
		}

		const station_list = /var station_names ='@(.+)';/.exec(html1)[1].split('@');
		for (const row of station_list) {
			const station_info = row.split('|');
			const id = station_info[5];
			if (stations[id]) {
				console.log('id %s 已存在', id);
			} else {
				stations[id] = {
					id,
					telegram_code: station_info[2],
					station_name: station_info[1],
					pin_yin: station_info[3],
					py: station_info[4],
					py_code: station_info[0],
				};
			}
		}
	});
}

InitStations();

jar.setCookie(request.cookie('RAIL_EXPIRATION=' + config.RAIL_EXPIRATION + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});
jar.setCookie(request.cookie('RAIL_DEVICEID=' + config.RAIL_DEVICEID + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});

function StationNameToStationInfo(station_name) {
	for (const station_id in stations) {
		const station_info = stations[station_id];
		if (station_info.station_name === station_name) {
			return station_info;
		}
	}

	return null;
}

function StationTelegramCodeToStationInfo(telegram_code) {
	for (const station_id in stations) {
		const station_info = stations[station_id];
		if (station_info.telegram_code === telegram_code) {
			return station_info;
		}
	}

	return null;
}

get('https://kyfw.12306.cn/otn/leftTicket/init', {
	'Origin': 'https://kyfw.12306.cn',
	'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
}, function (err1, html1) {
	if (err1) {
		console.log('err1', err1);
		return;
	}

	const ret = /var CLeftTicketUrl = '([^']+?)'/.exec(html1);
	const leftTicketUrl = ret[1];
	console.log(leftTicketUrl);

	const from_station = StationNameToStationInfo(config.from);
	const to_station = StationNameToStationInfo(config.to);
	console.log('出发站: %s => %s, 到达站: %s => %s', config.from, from_station.telegram_code, config.to, to_station.telegram_code);

	for (const train_date of config.train_dates) {
		get('https://kyfw.12306.cn/otn/' + leftTicketUrl +
			'?leftTicketDTO.train_date=' + train_date +
			'&leftTicketDTO.from_station=' + from_station.telegram_code +
			'&leftTicketDTO.to_station=' + to_station.telegram_code +
			'&purpose_codes=ADULT', {
				'Origin': 'https://kyfw.12306.cn',
				'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
			}, function (err2, html2) {
				if (err2) {
					console.log('err2', err2);
					return;
				}

				const j2 = JSON.parse(html2);
				// console.log(html2);
				// console.log(j2.data.result);

				// https://kyfw.12306.cn/otn/resources/merged/queryLeftTicket_end_js.js
				/*
					cU.secretStr = cO[0];
					cU.buttonTextInfo = cO[1];
					var cS = [];
					cS.train_no = cO[2];
					cS.station_train_code = cO[3];
					cS.start_station_telecode = cO[4];
					cS.end_station_telecode = cO[5];
					cS.from_station_telecode = cO[6];
					cS.to_station_telecode = cO[7];
					cS.start_time = cO[8];
					cS.arrive_time = cO[9];
					cS.lishi = cO[10];
					cS.canWebBuy = cO[11];
					cS.yp_info = cO[12];
					cS.start_train_date = cO[13];
					cS.train_seat_feature = cO[14];
					cS.location_code = cO[15];
					cS.from_station_no = cO[16];
					cS.to_station_no = cO[17];
					cS.is_support_card = cO[18];
					cS.controlled_train_flag = cO[19];
					cS.gg_num = cO[20] ? cO[20] : "--";
					cS.gr_num = cO[21] ? cO[21] : "--";
					cS.qt_num = cO[22] ? cO[22] : "--";
					cS.rw_num = cO[23] ? cO[23] : "--";
					cS.rz_num = cO[24] ? cO[24] : "--";
					cS.tz_num = cO[25] ? cO[25] : "--";
					cS.wz_num = cO[26] ? cO[26] : "--";
					cS.yb_num = cO[27] ? cO[27] : "--";
					cS.yw_num = cO[28] ? cO[28] : "--";
					cS.yz_num = cO[29] ? cO[29] : "--";
					cS.ze_num = cO[30] ? cO[30] : "--";
					cS.zy_num = cO[31] ? cO[31] : "--";
					cS.swz_num = cO[32] ? cO[32] : "--";
					cS.srrb_num = cO[33] ? cO[33] : "--";
					cS.yp_ex = cO[34];
					cS.seat_types = cO[35];
					cS.exchange_train_flag = cO[36];
					cS.houbu_train_flag = cO[37];
					cS.houbu_seat_limit = cO[38];
					cS.yp_info_new = cO[39];
					if (cO.length > 46) {
						cS.dw_flag = cO[46]
					}
					if (cO.length > 48) {
						cS.stopcheckTime = cO[48]
					}
					cS.from_station_name = cT[cO[6]];
					cS.to_station_name = cT[cO[7]];
					cU.queryLeftNewDTO = cS;
				*/

				for (const result of j2.data.result) {
					const parts = result.split('|');
					const start_info = StationTelegramCodeToStationInfo(parts[4]);
					const end_info = StationTelegramCodeToStationInfo(parts[5]);
					const from_info = StationTelegramCodeToStationInfo(parts[6]);
					const to_info = StationTelegramCodeToStationInfo(parts[7]);
					console.log('车次: %s, 起点站: %s, 终到站: %s, 出发站: %s, 到达站: %s, 出发时间: %s, 到达时间: %s, 历时: %s\n' +
						'商务座/特等座: %s, 一等座: %s, 二等座/二等包座: %s, ' +
						'高级软卧: %s, 软卧/一等卧: %s, 动卧: %s, 硬卧/二等卧: %s, ' +
						'软座: %s, 硬座: %s, 无座: %s, 其他: %s\n%s',
						parts[3],
						start_info.station_name,
						end_info.station_name,
						from_info.station_name,
						to_info.station_name,
						parts[8],
						parts[9],
						parts[10],
						parts[32] ? parts[32] : '--', // 商务座/特等座
						parts[31] ? parts[31] : '--', // 一等座
						parts[30] ? parts[30] : '--', // 二等座/二等包座
						parts[21] ? parts[21] : '--', // 高级软卧
						parts[23] ? parts[23] : '--', // 软卧/一等卧
						parts[33] ? parts[33] : '--', // 动卧
						parts[28] ? parts[28] : '--', // 硬卧/二等卧
						parts[24] ? parts[24] : '--', // 软座
						parts[29] ? parts[29] : '--', // 硬座
						parts[26] ? parts[26] : '--', // 无座
						parts[22] ? parts[22] : '--', // 其他
						'-'.repeat(100),
					);
				}
		});
	}
});
