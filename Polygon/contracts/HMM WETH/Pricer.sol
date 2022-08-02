// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface Ihmm {
    function owner() external view returns(address);
}

contract Root {

    // calculates a^(1/n) to dp decimal places
    // maxIts bounds the number of iterations performed
    function nthRoot(uint _a, uint _n, uint _dp, uint _maxIts) pure internal returns(uint) {
        assert (_n > 1);

        // The scale factor is a crude way to turn everything into integer calcs.
        // Actually do (a * (10 ^ ((dp + 1) * n))) ^ (1/n)
        // We calculate to one extra dp and round at the end
        uint one = 10 ** (1 + _dp);
        uint a0 = one ** _n * _a;

        // Initial guess: 1.0
        uint xNew = one;
        uint x;

        uint iter = 0;
        while (xNew != x && iter < _maxIts) {
            x = xNew;
            uint t0 = x ** (_n - 1);
            if (x * t0 > a0) {
                xNew = x - (x - a0 / t0) / _n;
            } else {
                xNew = x + (a0 / t0 - x) / _n;
            }
            ++iter;
        }

        // Round to nearest in the last dp.
        return (xNew + 5) / 10;
    }
}

/*
 * @title Pricer contract
 * @notice This contract give premium prices
 */
contract Pricer is Root {

    address public immutable HMM;

    uint256 decimal = 10000;

    uint256 public a;
    uint256 public b;
    uint256 public c;
    uint256 public d;    
    uint256 public f;
    uint256 public k;
    uint256 public T;

    uint256 public q;
    uint256 public u;
    uint256 public p;

    uint256 public t;

    /*
    * @notice Set the initial values ​​of the variables
    */
    constructor() {

        HMM = msg.sender;

        a = 4000;
        b = 100000;
        c = 10000;
        d = 400;    
        f = 15000;
        k = 1000;
        T = 31536000;

        q = 1;
        u = 3;
        p = 4;

        t = 86400;     
    }

    modifier onlyDAO() {
        require(msg.sender == Ihmm(HMM).owner(), "Caller is not the DAO");
        _;
    }

    /*
    * @notice All the functions below are a decomposition of the final formula "getPrice"
    */

    function getTimeProportion(uint256 _seconds) internal view returns(uint256) {
        require(_seconds > t && _seconds < T, "The duration of the contract must be between t and T.");
        return ((decimal*(T-_seconds))/T);
    }

    function getTimeAdjustment(uint256 _seconds) internal view returns(uint256) {
        return (((c*getTimeProportion(_seconds))/decimal)**p)/(decimal**(p-1));
    }

    function getPoolAdjustment(uint256 _o) internal view returns(uint256) {
        return ((decimal*a)/_o)**q;
    }

    function getTauBasis(uint256 _v) internal view returns(uint256) {
        require(_v > 50, "The strike price must be at least 0.5% higher than the current price (ChainLink Oracle).");
        uint256 result = (decimal*decimal)/(((b*_v)/decimal)+decimal);
        return result/10**2;
    }

    function getTimePower(uint256 _seconds) internal view returns(uint256) {
        uint256 calc = (getTimeProportion(_seconds)**u)/(decimal**(u-1));
        uint256 result;
        (calc/10**3 == 0) ? result = 1 : result = calc/10**3;
        return result;
    }

    function getTau(uint256 _v, uint256 _seconds) internal view returns(uint256) {
        uint256 TauBasis = getTauBasis(_v);
        uint256 firstRootNumer = Root.nthRoot(TauBasis, 10, 2, 30);
        uint256 secondRootNumer = firstRootNumer**(getTimePower(_seconds));
        uint256 resultNumer = secondRootNumer/100**(getTimePower(_seconds)-1);
        uint256 firstRootDenom = Root.nthRoot(100, 10, 2, 30);
        uint256 secondRootDenom = firstRootDenom**(getTimePower(_seconds));
        uint256 resultDenom = secondRootDenom/100**(getTimePower(_seconds)-1);
        uint256 result = (resultNumer*decimal)/resultDenom;
        return result;
    }

    function getTauPenalty(uint256 _v) internal view returns(uint256){
        return (f*_v)/decimal;
    }

    function getTauAdjustment(uint256 _v, uint256 _seconds) internal view returns(uint256) {
        uint256 result = getTau(_v, _seconds) - getTauPenalty(_v);
        return result;
    }

    /*
    * @notice Returns the desired APR for the HMM (10^4 decimal)
    */
    function getPrice(uint256 _seconds, uint256 _v, uint256 _o) external view returns(uint256) {
        uint256 poolAdjustment = getPoolAdjustment(_o);
        uint256 TauAdjustment = getTauAdjustment(_v, _seconds);
        uint256 TimeAdjustment = getTimeAdjustment(_seconds);
        uint256 result = (poolAdjustment*(((TauAdjustment*TimeAdjustment)/decimal)+d))/decimal+k;
        return result;
    }

    /*
    * @notice All the functions below will allow the DAO to modify the variables
    */

    function setA(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 100000, "Wrong value for a.");
        a = _value;
    }

    function setB(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 1000000, "Wrong value for b.");
        b = _value;
    }

    function setC(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 100000, "Wrong value for c.");
        c = _value;
    }

    function setD(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 10000, "Wrong value for d.");
        d = _value;
    }

    function setF(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 100000, "Wrong value for f.");
        f = _value;
    }

    function setK(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 10000, "Wrong value for k.");
        k = _value;
    }

    function setT(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 315360000, "Wrong value for T.");
        T = _value;
    }

    function sett(uint256 _value) external onlyDAO {
        require(0 < _value && _value < T, "Wrong value for t.");
        t = _value;
    }

    function setQ(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 10, "Wrong value for Q.");
        q = _value;
    }

    function setU(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 10, "Wrong value for U.");
        u = _value;
    }

    function setP(uint256 _value) external onlyDAO {
        require(0 < _value && _value < 10, "Wrong value for P.");
        p = _value;
    }
    
}