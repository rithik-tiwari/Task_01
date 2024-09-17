const XLSX = require('xlsx');
const { validateHeaders, cleanKeys } = require('./headerValidation');
class Excel {
	constructor(file) {
		this.file = file;
	}

	async readExcel() {
		try {
			const buffer = await this.file.buffer;
			const workbook = XLSX.read(buffer, { type: 'buffer' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet);
			

			return { jsonData, worksheet };
		} catch (err) {
			console.error('Error reading Excel file:', err);
			throw new Error('Error in reading excel file');
		}
	}

	matchHeaders(worksheet) {
		const headers = [];
		let rowIndex = 0; // Assuming headers are in the first row (adjust if headers are in a different row)
		const range = XLSX.utils.decode_range(worksheet['!ref']);
		console.log(range); 

		for (let C = range.s.c; C <= range.e.c; ++C) {
			const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: C })];
			if (cell && cell.t) {
				headers.push(cell.v.toString());
			}
		}
		console.log(JSON.stringify(headers));
		const missingHeaders = validateHeaders(headers);
		console.log('missingHeaders---------', missingHeaders);

		//console.log(missingHeaders) ;
		return missingHeaders == null ? 1 : 0;
	}

	cleanData(jsonData) {
		const savedData = [];
		for (let i = 0; i < jsonData.length; i++) {
			let cleanedData = cleanKeys(jsonData[i]);
			savedData.push(cleanedData);
		}

		return savedData;
	}
}

module.exports = Excel;
