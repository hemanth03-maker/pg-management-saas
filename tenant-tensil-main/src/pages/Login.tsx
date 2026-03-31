import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "917899300966";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi, I want to use your PG management system.");

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <LogIn size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Login to Your PG Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in with your credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 h-11" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 h-11" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 font-semibold text-base">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">Need access? Contact us on WhatsApp</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full"
          >
            <Button variant="outline" className="w-full h-11 font-semibold text-base gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
              <MessageCircle size={18} />
              Request Access
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
