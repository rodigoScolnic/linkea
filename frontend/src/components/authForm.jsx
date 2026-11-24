import { Link } from "react-router"

const AuthForm = () => (
        <section className="auth-form">
            <h3>Inicia secion</h3>
            <form action="/">
                <input type="text" placeholder="nombre de usuario"/>
                <input type="password" placeholder="password"/>
                <button type="submit">comenzar</button>
            </form>
            <p>si no tenes cuenta <a href="">registrate</a> ahora</p>
            <Link to="/home" id="guestBtn">o entra como invitado</Link>
        </section>
        
)


export default AuthForm