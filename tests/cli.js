const chai = require('chai');
const expect = require('chai').expect;

const spies = require('chai-spies');
chai.use(spies);

const cli = require('../cli');

describe('cli', () => {

	beforeEach(() => {
		chai.spy.on(console, 'log');
	});

	afterEach(() => {
		chai.spy.restore(console, 'log');
	});

	describe('scan and print results', () => {

		it('should print results without arguments', () => {
			const results = cli.scan();

			expect(console.log).to.have.been.called.with('\x1b[32m### LICENSES ###\x1b[0m');
			expect(console.log).to.have.been.called.with('\x1b[32m### STATISTICS ###\x1b[0m');

			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.statistics.totalModules).to.be.a('number');
		});

		it('should print results with directory argument', () => {
			const results = cli.scan('./node_modules/');

			expect(console.log).to.have.been.called.with('\x1b[32m### LICENSES ###\x1b[0m');
			expect(console.log).to.have.been.called.with('\x1b[32m### STATISTICS ###\x1b[0m');

			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.statistics.totalModules).to.be.a('number');
		});

		it('should print results with directory and format arguments', () => {
			const results = cli.scan('./node_modules/', 'print');

			expect(console.log).to.have.been.called.with('\x1b[32m### LICENSES ###\x1b[0m');
			expect(console.log).to.have.been.called.with('\x1b[32m### STATISTICS ###\x1b[0m');

			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.statistics.totalModules).to.be.a('number');
		});
	});

	describe('scan and return results', () => {

		it('should return json results', () => {
			const results = cli.scan('./node_modules/', 'json');

			expect(console.log).to.not.have.been.called;

			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.statistics.totalModules).to.be.a('number');
		});
	});

});
