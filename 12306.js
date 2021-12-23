
'use strict';

const request = require('request');

const jar = request.jar();

const config = {
	// 自己打开 12306 官网主页获取对应的 Cookie 字段
	'RAIL_EXPIRATION': '1640339206433',
	'RAIL_DEVICEID': 'jhj5fAgLckRdVsjTYpEodl3joDjd2srNWgsW76xH5Nysv2gJZUO25tQa1MHy2g1deWtNmxhmn7aV0DR5PboNFxL-VOy5-4676bn4Cbk9X4OmoIU8dF8qdmPm1dhXGiU5mZBzwFJJWGee5l9beFBFL0FoXkiS98Ra',
	'ocrurl': '', // 自建 12306 验证码 OCR 网址，自建方法参考：https://py12306-helper.pjialin.com/
	'username': '', // 在 12306 官网登录后打开个人信息里面的用户名
	'password': ''
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

jar.setCookie(request.cookie('RAIL_EXPIRATION=' + config.RAIL_EXPIRATION + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});
jar.setCookie(request.cookie('RAIL_DEVICEID=' + config.RAIL_DEVICEID + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});

get('https://kyfw.12306.cn/otn/login/conf', {
	'Origin': 'https://kyfw.12306.cn',
	'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
}, function (err1, html1) {
	if (err1) {
		console.log('err1', err1);
		return;
	}

	// console.log(html1);
	const loginConf = JSON.parse(html1);
	console.log(loginConf.data.is_login_passCode === 'Y' ? '需要验证码登录' : '无需验证码登录');

	get('https://kyfw.12306.cn/passport/captcha/captcha-image64?login_site=E&module=login&rand=sjrand&_=' + Math.random(), {
		'Origin': 'https://kyfw.12306.cn',
		'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
	}, function (err2, html2) {
		if (err2) {
			console.log('err2', err2);
			return;
		}

		const h2 = JSON.parse(html2);
		// console.log(html2);
		console.log(h2.image);

		post(config.ocrurl, {
			'img': h2.image
		}, {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
		}, function (err3, html3) {
			if (err3) {
				console.log('err3', err3);
				return;
			}

			const h3 = JSON.parse(html3);
			const answer = ConvertPosition(h3.result);
			// console.log(html3);
			console.log(answer);

			// jar.setCookie(request.cookie('cursorStatus=off; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){})
			// jar.setCookie(request.cookie('guidesStatus=off; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){})
			// jar.setCookie(request.cookie('highContrastMode=defaltMode; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){})

			get('https://kyfw.12306.cn/passport/captcha/captcha-check?answer=' + answer + '&rand=sjrand&login_site=E&_=' + Math.random(), {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin': 'https://kyfw.12306.cn',
				'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
			}, function (err4, html4) {
				if (err4) {
					console.log('err4', err4);
					return;
				}

				const h4 = JSON.parse(html4);
				// console.log(html4);
				console.log(h4.result_code, h4.result_message);

				post('https://kyfw.12306.cn/passport/web/login', {
					'username': config.username,
					'password': config.password,
					'appid': 'otn',
					'answer': answer
				}, {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Origin': 'https://kyfw.12306.cn',
					'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
				}, function (err5, html5) {
					if (err5) {
						console.log('err5', err5);
						return;
					}

					console.log(html5);
				});
			});
		});
	});
});
