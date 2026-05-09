import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiHome } from 'react-icons/fi';
import { toast } from '../utils/swal';
import useAuth from '../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    storeName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.storeName.trim()) errs.storeName = 'Store name is required';
    if (!form.name.trim()) errs.name = 'Your name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (form.phone && !/^\+?[\d\s-]{7,15}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.terms = 'You must agree to the terms';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        store_name: form.storeName,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-4">Get Started Today</h2>
          <p className="text-primary-200 text-lg mb-8">
            Create your store in minutes. Start managing your business efficiently.
          </p>
          <div className="space-y-6">
            {[
              { title: 'Free 14-day trial', desc: 'No credit card required' },
              { title: 'All features included', desc: 'Full access during trial' },
              { title: 'Cancel anytime', desc: 'No obligations' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-primary-200 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-secondary-900">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
              <FiShoppingCart className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Create Account</h1>
            <p className="mt-2 text-secondary-500 dark:text-secondary-400">Start your free trial today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Store Name</label>
              <div className="relative">
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                <input
                  type="text" name="storeName" value={form.storeName} onChange={handleChange}
                  placeholder="Your store name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.storeName ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                  }`}
                />
              </div>
              {errors.storeName && <p className="mt-1 text-sm text-danger-500">{errors.storeName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Your Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.name ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-danger-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.email ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-danger-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.phone ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-danger-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.password ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-danger-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                  <input
                    type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.confirmPassword ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-danger-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
              />
              <label className="text-sm text-secondary-600 dark:text-secondary-400">
                I agree to the{' '}
                <span className="text-primary-600 hover:text-primary-500 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-primary-600 hover:text-primary-500 cursor-pointer">Privacy Policy</span>
              </label>
            </div>
            {errors.terms && <p className="text-sm text-danger-500">{errors.terms}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary-500 dark:text-secondary-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
