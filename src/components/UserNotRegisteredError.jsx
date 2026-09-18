export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">401</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">Compte non reconnu</h2>
            <p className="text-slate-600 leading-relaxed">
              Aucun compte associé à cette connexion n'a été trouvé. Vérifiez que vous utilisez
              la bonne adresse e-mail, ou créez un compte pour continuer.
            </p>
          </div>

          <div className="pt-6 flex items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Se connecter
            </a>
            <a
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
