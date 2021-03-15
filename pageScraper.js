const mailService = require('./emailService');
const BASEURL = 'http://academica.psi.uba.ar/'
const USERNAME = 'aa'
const PASSWORD = 'aa'
const USERNAME_SELECTOR = '#dni';
const PASSWORD_SELECTOR = '#password';
const CTA_SELECTOR = '#login';

const catedra = process.argv[2]
if(!catedra) { console.error('Hay que poner nro de catedra'); process.exit(1) }
const SUBSITE = `http://academica.psi.uba.ar/Psi/Ver154_.php?catedra=${catedra}`

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

		const pepe = await page.evaluate(async () => {
			const getAvailable = async () => {
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
					console.log('No se encontraron resultados, esperando 1 min')
					const timer = ms => new Promise(res => setTimeout(res, ms))
					await timer(60000)
				}
				return hayCupos
			}
			let res = await getAvailable()
			let int = 0
			while(!res){
				console.log(`volviendo a intentar... ${++int}`)
				res = await getAvailable()
			}
			return res
		})

		console.log(pepe)
		const start1 = `<h1>HAY CUPOS DE LA CATEDRA ${catedra}</h1>`
		const start2 = '<ul><li>'
		const joinedArray = pepe.join('</li><li>')
		const end = '</li></ul>'
		const emailBody = `${start1}${start2}${joinedArray}${end}`
		const header = `HAY CUPOS!!!`
		mailService.sendMail(header, emailBody)
	}
}

module.exports = scraperObject;
