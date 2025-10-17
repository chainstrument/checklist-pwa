"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const handleSignup = async () => {
		const { error } = await supabase.auth.signUp({ email, password });

		if (error) {
			setError(error.message);
		} else {
			router.push('/');
		}
	};

	return (
		<main className="p-6 max-w-sm mx-auto">
			<h1 className="text-2xl font-bold mb-4">Inscription</h1>

			<input
				type="email"
				placeholder="Email"
				className="w-full border px-3 py-2 mb-2"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<input
				type="password"
				placeholder="Mot de passe"
				className="w-full border px-3 py-2 mb-2"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>

			{error && <p className="text-red-500 mb-2">{error}</p>}

					<button
						onClick={handleSignup}
						className="bg-green-600 text-white w-full py-2 rounded"
					>
						S&apos;inscrire
					</button>
		</main>
	);
}
