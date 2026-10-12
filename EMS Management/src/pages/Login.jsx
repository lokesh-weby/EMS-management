import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Phone,
  Check,
  X,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { loginWithEmailPassword, registerUser, resetPassword, loading, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation mode: 'login' | 'register' | 'forgot'
  const [viewMode, setViewMode] = useState('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regSalutation, setRegSalutation] = useState('Dr.');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [checkingUser, setCheckingUser] = useState(false);

  const from = location.state?.from?.pathname;

  // Real-time Password Validation Criteria
  const isLengthValid = regPassword.length >= 6;
  const hasSmall = /[a-z]/.test(regPassword);
  const hasCaps = /[A-Z]/.test(regPassword);
  const hasNumeric = /[0-9]/.test(regPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword);
  const isConfirmMatch = regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  const isPasswordValid = isLengthValid && hasSmall && hasCaps && hasNumeric && hasSpecial;
  const isRegFormValid = regName.trim() !== '' && regEmail.trim() !== '' && isPasswordValid && isConfirmMatch;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const authenticatedUser = await loginWithEmailPassword(email, password);
      if (authenticatedUser) {
        if (from) {
          navigate(from, { replace: true });
        } else if (authenticatedUser.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/coordinator/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error("Firebase Login failed:", err);
    }
  };

  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isRegFormValid) return;
    setRegError('');
    setRegSuccessMsg('');

    const combinedFullName = `${regSalutation} ${regName.trim()}`.trim();

    try {
      const res = await registerUser({
        fullName: combinedFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone
      });

      if (res && res.message) {
        setRegSuccessMsg(res.message);
        setRegSalutation('Dr.');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegPhone('');
      }
    } catch (err) {
      setRegError(err.message || 'User Registration failed.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotMsg('');
    setForgotError('');
    setCheckingUser(true);

    try {
      const res = await resetPassword(forgotEmail);
      setForgotMsg(res.message || `Password reset link has been dispatched to ${forgotEmail}.`);
    } catch (err) {
      setForgotError(err.message || 'User does not exist in Firebase Auth.');
    } finally {
      setCheckingUser(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-5xl relative z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center">
          <img src="/srm logo.svg" alt="srmist Logo" className="h-14 mx-auto object-contain mb-3" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            EMS Management Portal
          </h1>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Member Welcome Notice */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xl space-y-5 text-slate-700 text-xs sm:text-sm">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Dear members,</h2>
              <p className="text-sm font-bold text-indigo-600">Welcome to srmist Event Portal</p>
            </div>

            <p className="text-slate-600 leading-relaxed">
              srmist conducts National, International Conference, Workshop and Seminar to share the knowledge and innovative ideas for the benefit of Researchers, Academics, Students and other stake holder.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 italic font-semibold text-xs text-center">
              &quot;Platform for sharing the Research outcome&quot;.
            </div>

            {/* <div className="pt-3 border-t border-slate-100 space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider underline">New Users:</h4>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
                  <li>
                    Login with your email id for new registration{' '}
                    <button 
                      type="button"
                      onClick={() => setViewMode('register')} 
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Click here
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider underline">Existing Users:</h4>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
                  <li>
                    Login with the (Email ID){' '}
                    <button 
                      type="button"
                      onClick={() => setViewMode('login')} 
                      className="text-indigo-600 font-bold hover:underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </li>
                </ul>
              </div>
            </div> */}
          </div>

          {/* Right Column: Dynamic Form Panel */}
          <div id="login-form" className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white">
            {/* Mode Switcher Tabs (Sign In vs Register) */}
            {viewMode !== 'forgot' && (
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setRegError('');
                    setRegSuccessMsg('');
                    setForgotError('');
                    setForgotMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'login' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('register');
                    setRegName('');
                    setRegEmail('');
                    setRegPassword('');
                    setRegConfirmPassword('');
                    setRegPhone('');
                    setRegError('');
                    setRegSuccessMsg('');
                    setForgotError('');
                    setForgotMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'register' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {viewMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">Sign In to Portal</h3>
                  <p className="text-xs text-slate-500 mb-4">Enter your registered email and password to access dashboard.</p>
                </div>

                {authError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@college.edu"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setViewMode('forgot')}
                      className="text-xs text-indigo-600 font-bold hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-white text-sm font-extrabold tracking-wide shadow-md shadow-[#0c4da2]/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Checking credentials...' : 'Sign In to Portal'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 2. REGISTRATION FORM */}
            {viewMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#0c4da2]" />
                    Register New Account
                  </h3>
                  <p className="text-xs text-slate-500">Fill in your details to create an official coordinator/user account.</p>
                </div>

                {regSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Email Verification Link Sent!</span>
                    </div>
                    <p className="leading-relaxed text-emerald-800">{regSuccessMsg}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('login');
                          setRegSuccessMsg('');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Proceed to Sign In
                      </button>
                    </div>
                  </div>
                )}

                {regError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Full Name & Salutation */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={regSalutation}
                      onChange={(e) => setRegSalutation(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0c4da2]"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>

                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="off"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@srmist.edu.in"
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                    />
                  </div>
                </div>

                      {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                    />
                  </div>
                </div>

          

                {/* Password Validation Checklist Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                    <span>Password Validation Checklist</span>
                    <ShieldCheck className="w-4 h-4 text-[#0c4da2]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {isLengthValid ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Length min. 6 chars</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasSmall ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {hasSmall ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Small letter (a-z)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasCaps ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {hasCaps ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Caps letter (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasNumeric ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {hasNumeric ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Numeric digit (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Special char (!@#$%^&*)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${isConfirmMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {isConfirmMatch ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isRegFormValid}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-white text-sm font-extrabold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account in Firebase...' : 'Create Account & Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {viewMode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#0c4da2]" />
                  Reset Password
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your registered college email. We will check if the account exists in Firebase Auth before sending a reset link.
                </p>

                {forgotError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{forgotMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotError('');
                      setForgotMsg('');
                    }}
                    placeholder="name@college.edu"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setForgotError('');
                      setForgotMsg('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={checkingUser}
                    className="px-4 py-2.5 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {checkingUser ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking Firebase...</span>
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
