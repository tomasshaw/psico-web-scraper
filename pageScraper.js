const mailService = require('./emailService');
const BASEURL = process.env.BASEURL
const USERNAME = process.env.SITE_USERNAME
const PASSWORD = process.env.SITE_PASSWORD
const TIMEOUT = process.env.TIMEOUT
const USERNAME_SELECTOR = '#dni';
const PASSWORD_SELECTOR = '#password';
const CTA_SELECTOR = '#login';

const catedra = process.argv[2]
if(!catedra) { console.error('Hay que poner nro de catedra'); process.exit(1) }
const SUBSITE = `${BASEURL}Psi/Ver154_.php?catedra=${catedra}`

const getCupos = {
	async get(page) {
		return await page.evaluate(async (TIMEOUT) => {
			const tableItems = [
				...document
				.querySelectorAll('.table_tabs')[1]
				.childNodes[1]
				.childNodes
			]
			const baseArray = tableItems.map(item => item.cells[6].innerText)
			baseArray.shift()
			const hayCupos = baseArray.some(i => i > 0)

			if(hayCupos) {
				const arrayCuposDisponibles = []
				baseArray.forEach((item, index) => {
					if(item > 0){
						const element = tableItems[index+1].cells
						const string = ` Quedan${element[6].innerText} vacantes en la comision${element[0].innerText}, los dias${element[1].innerText}, de${element[2].innerText} a${element[3].innerText}, con ${element[5].innerText}.`
						arrayCuposDisponibles.push(string)
					}
				})
				return arrayCuposDisponibles
			} else {
				console.log(`No se encontraron resultados, esperando ${TIMEOUT / 1000 / 60} mins | ${TIMEOUT / 1000} sec`)
				const timer = ms => new Promise(res => setTimeout(res, ms))
				await timer(TIMEOUT)
			}
			return hayCupos
		}, TIMEOUT)
	}
}

const scraperObject = {
	async scraper(browser){
		let page = await browser.newPage();
		console.log(`Navegando a ${BASEURL}...`);
		await page.goto(BASEURL, {waitUntil: 'networkidle2'});
		console.log('Loggeando');
		await page.type(USERNAME_SELECTOR, USERNAME)
		await page.type(PASSWORD_SELECTOR, PASSWORD)
		await page.click(CTA_SELECTOR);
		await page.waitForSelector('#content')
		console.log('Login correcto! Entrando...');
		await page.goto(SUBSITE)
		await page.waitForSelector('.table_tabs')
		page.on('console', cons => console.log(cons.text()))

		let cupos = await getCupos.get(page)
		let int = 0
		while(!cupos){
			console.log(`volviendo a intentar... ${++int}`)
			await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
			cupos = await getCupos.get(page)
		}

		const start1 = `<h1>HAY CUPOS DE LA CATEDRA ${catedra}</h1>`
		const start2 = '<ul><li>'
		const joinedArray = cupos.join('</li><li>')
		const end = '</li></ul>'
		const emailBody = `${start1}${start2}${joinedArray}${end}`
		const header = `HAY CUPOS!!!`
		mailService.sendMail(header, emailBody)
	}
}

module.exports = scraperObject;
