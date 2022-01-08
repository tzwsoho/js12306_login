
'use strict';

const request = require('request');

const jar = request.jar();

const config = {
	// 自己打开 12306 官网主页获取对应的 Cookie 字段
	'RAIL_EXPIRATION': '1640339206433',
	'RAIL_DEVICEID': 'jhj5fAgLckRdVsjTYpEodl3joDjd2srNWgsW76xH5Nysv2gJZUO25tQa1MHy2g1deWtNmxhmn7aV0DR5PboNFxL-VOy5-4676bn4Cbk9X4OmoIU8dF8qdmPm1dhXGiU5mZBzwFJJWGee5l9beFBFL0FoXkiS98Ra',
	'username': '', // 在 12306 官网登录后打开个人信息里面的用户名
	'password': '',
	'cast_num': '' // 登录账号绑定的证件号后 4 位
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

jar.setCookie(request.cookie('RAIL_EXPIRATION=' + config.RAIL_EXPIRATION + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});
jar.setCookie(request.cookie('RAIL_DEVICEID=' + config.RAIL_DEVICEID + '; Path=/'), 'https://kyfw.12306.cn/', function (err, cookie){});

sms();

function sms() {
	post('https://kyfw.12306.cn/passport/web/getMessageCode', {
		'appid': 'otn',
		'username': config.username,
		'castNum': config.cast_num
	}, {
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Origin': 'https://kyfw.12306.cn',
		'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
	}, function (err1, html1) {
		if (err1) {
			console.log('err1', err1);
			return;
		}

		console.log(html1);

		readline.question('请输入手机收到的 12306 验证码？', answer => {
			readline.close();

			console.log('你输入的验证码是: %s', answer);

			post('https://kyfw.12306.cn/passport/web/login', {
				'sessionId': '',
				'sig': '',
				'if_check_slide_passcode_token': '',
				'scene': '',
				'checkMode': '0',
				'randCode': answer,
				'username': config.username,
				'password': config.password,
				'appid': 'otn'
			}, {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Origin': 'https://kyfw.12306.cn',
				'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
			}, function (err2, html2) {
				if (err2) {
					console.log('err2', err2);
					return;
				}

				console.log('html2', html2);

				get('https://kyfw.12306.cn/otn/login/userLogin', {
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'Origin': 'https://kyfw.12306.cn',
					'Referer': 'https://kyfw.12306.cn/otn/resources/login.html',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
				}, function (err3, html3) {
					if (err3) {
						console.log('err3', err3);
						return;
					}

					// console.log('html3', html3);

					post('https://kyfw.12306.cn/passport/web/auth/uamtk', {
						'appid': 'otn'
					}, {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						'Cache-Control': 'no-cache',
						'Connection': 'keep-alive',
						'Origin': 'https://kyfw.12306.cn',
						'Referer': 'https://kyfw.12306.cn/otn/passport?redirect=/otn/login/userLogin',
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
					}, function (err4, html4) {
						if (err4) {
							console.log('err4', err4);
							return;
						}

						const h4 = JSON.parse(html4);
						console.log('html4', html4);
						console.log(h4.newapptk);

						if (!h4.newapptk) return

						post('https://kyfw.12306.cn/otn/uamauthclient', {
							'tk': h4.newapptk
						}, {
							'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
							'Cache-Control': 'no-cache',
							'Connection': 'keep-alive',
							'Origin': 'https://kyfw.12306.cn',
							'Referer': 'https://kyfw.12306.cn/otn/passport?redirect=/otn/login/userLogin',
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
						}, function (err5, html5) {
							if (err5) {
								console.log('err5', err5);
								return;
							}

							const h5 = JSON.parse(html5);
							console.log('html5', html5);
							console.log(h5.username, h5.apptk);

							get('https://kyfw.12306.cn/otn/confirmPassenger/getPassengerDTOs', {
								'Cache-Control': 'no-cache',
								'Connection': 'keep-alive',
								'Origin': 'https://kyfw.12306.cn',
								'Referer': 'https://kyfw.12306.cn/otn/leftTicket/init',
								'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
							}, function (err6, html6) {
								if (err6) {
									console.log('err6', err6);
									return;
								}

								console.log('html6', html6);
							});
						});
					});
				});
			});
		});
	});
}