const chai = require('chai');
const expect = require('chai').expect;

const spies = require('chai-spies');
chai.use(spies);

const scanner = require('../index');

describe('scanner', () => {

	beforeEach(() => {
		chai.spy.on(console, 'log');
	});

	afterEach(() => {
		chai.spy.restore(console, 'log');
	});

	describe('is spdx license', () => {

		it('should have external license', () => {
			const results = scanner.utilities.isSpdx('SEE LICENSE IN');

			expect(results).to.be.true;
		});

		it('should have plain MIT license', () => {
			const results = scanner.utilities.isSpdx('MIT');

			expect(results).to.be.true;
		});

		it('should have expression MIT license', () => {
			const results = scanner.utilities.isSpdx('(MIT)');

			expect(results).to.be.true;
		});

		it('should have expression MIT or MS-PL license', () => {
			const results = scanner.utilities.isSpdx('(MIT OR MS-PL)');

			expect(results).to.be.true;
		});

		it('should not have empty license', () => {
			const results = scanner.utilities.isSpdx('');

			expect(results).to.be.false;
		});

		it('should not have bogus license', () => {
			const results = scanner.utilities.isSpdx('(BOGUS)');

			expect(results).to.be.false;
		});
	});

	describe('is osi approved license', () => {

		it('should have external license', () => {
			const results = scanner.utilities.isOsiApproved('SEE LICENSE IN');

			expect(results).to.be.true;
		});

		it('should have plain MIT license', () => {
			const results = scanner.utilities.isOsiApproved('MIT');

			expect(results).to.be.true;
		});

		it('should have expression MIT license', () => {
			const results = scanner.utilities.isOsiApproved('(MIT)');

			expect(results).to.be.true;
		});

		it('should have expression MIT or MS-PL license', () => {
			const results = scanner.utilities.isOsiApproved('(MIT OR MS-PL)');

			expect(results).to.be.true;
		});

		it('should not have empty license', () => {
			const results = scanner.utilities.isOsiApproved('');

			expect(results).to.be.false;
		});

		it('should not have bogus license', () => {
			const results = scanner.utilities.isOsiApproved('APACHE-1.0');

			expect(results).to.be.false;
		});

		it('should not have bogus license', () => {
			const results = scanner.utilities.isOsiApproved('(BOGUS)');

			expect(results).to.be.false;
		});
	});

	describe('get licenses', () => {

		it('should have licenses', () => {
			const results = scanner.utilities.getLicenses('./node_modules');

			expect(results).to.be.a('array');
			expect(results.length).to.be.gt(0);
		});

		it('should not have licenses', () => {
			const results = scanner.utilities.getLicenses('./bogus');

			expect(results).to.be.a('array');
			expect(results.length).to.equal(0);
		});
	});

	describe('get statistics', () => {

		it('should have statistics', () => {
			const licenses = scanner.utilities.getLicenses('./node_modules');
			const results = scanner.utilities.getStatistics(licenses);

			expect(results).to.be.a('object');
			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.licenses.length).to.be.equal(licenses.length);
			expect(results.statistics.totalModules).to.be.a('number');
			expect(results.statistics.totalModules).to.be.gte(licenses.length);
			expect(results.statistics.totalNonSpdxLicenses).to.be.a('number');
			expect(results.statistics.totalNolicense).to.be.a('number');
			expect(results.statistics.totalUnlicensed).to.be.a('number');
			expect(results.statistics.totalNonCompliantLicenses).to.be.a('number');
			expect(results.statistics.totalUniqueLicenses).to.be.a('number');
			expect(results.statistics.uniques).to.be.a('object');
		});

		it('should not have statistics for undefined licenses', () => {
			const results = scanner.utilities.getStatistics();

			expect(results).to.be.a('object');
			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.licenses.length).to.be.equal(0);
			expect(results.statistics.totalModules).to.be.a('number');
			expect(results.statistics.totalModules).to.be.equal(0);
		});

		it('should not have statistics for empty licenses', () => {
			const results = scanner.utilities.getStatistics([]);

			expect(results).to.be.a('object');
			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
			expect(results.licenses.length).to.be.equal(0);
			expect(results.statistics.totalModules).to.be.a('number');
			expect(results.statistics.totalModules).to.be.equal(0);
		});
	});

	describe('print licenses', () => {

		it('should print licenses', () => {
			const licenses = scanner.utilities.getLicenses('./node_modules');
			scanner.utilities.printLicenses(licenses);

			expect(console.log).to.have.been.called.with('\x1b[32m### LICENSES ###\x1b[0m');
		});
	});

	describe('print statistics', () => {

		it('should print statistics', () => {
			const licenses = scanner.utilities.getLicenses('./node_modules');
			const results = scanner.utilities.printStatistics(licenses);

			expect(console.log).to.have.been.called.with('\x1b[32m### STATISTICS ###\x1b[0m');

			expect(results).to.be.a('object');
			expect(results.licenses).to.be.a('array');
			expect(results.statistics).to.be.a('object');
		});
	});

});
