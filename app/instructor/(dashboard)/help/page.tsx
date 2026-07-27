import { BookOpen, User, Video, Wallet, Share2, Calendar, CheckCircle, HelpCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";

export default function InstructorHelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-400 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900 mb-3">
          Instructor Guide
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to know about teaching on Lean Sporty, from setting up your profile to running your first live class
        </p>
      </div>

      {/* Quick Start Section */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 mb-8 border border-pink-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-pink-500" />
          Quick Start Checklist
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <p className="text-gray-700">Get your personal invite link from the Lean Sporty team (apply at leansporty.com/teach)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <p className="text-gray-700">Open your invite link and sign in — it activates your Studio in one click</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <p className="text-gray-700">Create your instructor profile</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <p className="text-gray-700">Schedule your first live class</p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="space-y-8">

        {/* Getting Started */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Getting Started as an Instructor</h2>
              <p className="text-gray-600">How to join the Lean Sporty instructor community</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I become an instructor?</h3>
              <p className="text-gray-700 mb-3">
                Lean Sporty uses an invite-only system to ensure quality instruction. To become an instructor:
              </p>
              <ol className="space-y-2 ml-6 list-decimal text-gray-700">
                <li>Apply at leansporty.com/teach — or get in touch with the Lean Sporty team</li>
                <li>Once approved, you'll receive a personal invite link (leansporty.com/welcome/...)</li>
                <li>Open the link and sign in — your Studio activates in one click</li>
                <li>Got a plain invite code instead? Enter it on the instructor activation page</li>
                <li>Complete your instructor profile setup</li>
              </ol>
            </div>

            <Alert variant="info">
              <p className="font-semibold mb-1">Important Note</p>
              <p className="text-sm">
                You only need the invite once. After creating your profile, you can access the instructor
                dashboard anytime just by signing in to your account.
              </p>
            </Alert>
          </div>
        </section>

        {/* Setting Up Your Profile */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Setting Up Your Profile</h2>
              <p className="text-gray-600">Create a professional profile that attracts students</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your public profile</h3>
              <p className="text-gray-700 mb-4">
                Your instructor profile is public and appears at <span className="font-mono bg-gray-100 px-2 py-1 rounded">leansporty.com/@yourname</span>.
                This is where potential students learn about you before enrolling in your classes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile information</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Display Name (Required)</p>
                    <p className="text-gray-600 text-sm">Your name as students will see it. This appears on all your classes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Profile URL (Required)</p>
                    <p className="text-gray-600 text-sm">
                      Your unique URL slug (e.g., "sarahfitness"). This is auto-generated from your name but you can customize it.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Bio (Recommended)</p>
                    <p className="text-gray-600 text-sm">
                      Tell students about your experience, certifications, and teaching style. A compelling bio increases enrollments!
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Profile Photo (Recommended)</p>
                    <p className="text-gray-600 text-sm">
                      A professional, friendly photo helps build trust. You'll have a special gradient ring around your photo as an instructor!
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Social Links (Optional)</p>
                    <p className="text-gray-600 text-sm">Link your Instagram and website to build your brand and connect with students.</p>
                  </div>
                </li>
              </ul>
            </div>

            <Alert variant="info">
              <p className="font-semibold mb-1">Pro Tip</p>
              <p className="text-sm">
                Complete profiles get more enrollments! The dashboard shows your profile completion percentage
                and reminds you what's missing.
              </p>
            </Alert>
          </div>
        </section>

        {/* Creating & Managing Classes */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Creating & Managing Classes</h2>
              <p className="text-gray-600">Schedule and run your live fitness classes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to schedule a class</h3>
              <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                <li>
                  <p className="font-semibold text-gray-900">Open "Classes"</p>
                  <p className="text-sm text-gray-600">Go to "Classes" in the navigation and click the "Schedule a Class" button. You can also start from your dashboard.</p>
                </li>
                <li>
                  <p className="font-semibold text-gray-900">Fill in class details</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-4">
                    <li>• <strong>Title:</strong> Clear, descriptive name (e.g., "30-Min HIIT Dance Cardio")</li>
                    <li>• <strong>Description:</strong> What to expect, fitness level, equipment needed</li>
                    <li>• <strong>Date & Time:</strong> When your class will start (shown in your local timezone)</li>
                    <li>• <strong>Duration:</strong> How long the class will be, 15–180 minutes</li>
                    <li>• <strong>Price:</strong> Pick a preset or a custom amount (paid classes start at €5), or choose Free — you keep 80% of every sale after VAT (85% as a featured instructor)</li>
                  </ul>
                </li>
                <li>
                  <p className="font-semibold text-gray-900">Click "Schedule Class"</p>
                  <p className="text-sm text-gray-600">Your class appears immediately on the public Live Streams page and your profile.</p>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Class status explained</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Alert variant="info" hideIcon>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5" />
                    <p className="font-semibold">Scheduled</p>
                  </div>
                  <p className="text-sm">
                    Your class is published and students can enroll. Appears in "Upcoming Classes".
                  </p>
                </Alert>
                <Alert variant="error" hideIcon>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="font-semibold">Live</p>
                  </div>
                  <p className="text-sm">
                    Your class is currently broadcasting. Appears in "LIVE NOW" section with special styling.
                  </p>
                </Alert>
                <Alert variant="info" hideIcon>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">Ended</p>
                  </div>
                  <p className="text-sm">
                    Class finished. Shows in your "Past Classes" and recording becomes available.
                  </p>
                </Alert>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Going live - it's easy!</h3>
              <p className="text-gray-700 mb-4">
                Broadcasting your class is simple - everything happens in your browser with just one button click.
                Here's what to do:
              </p>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200 mb-6">
                <p className="font-bold text-gray-900 mb-4 text-lg">Quick Start Guide:</p>
                <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                  <li>
                    <p className="font-semibold text-gray-900">Open your broadcast page</p>
                    <p className="text-sm text-gray-600">Go to "Classes" and click "Broadcast" on your scheduled class</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Set up your camera</p>
                    <p className="text-sm text-gray-600">Click "Set up camera & microphone" and allow access when your browser asks — nothing is broadcast yet</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Click "Start Broadcast"</p>
                    <p className="text-sm text-gray-600">This is the moment your class goes live</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Wait for the connection</p>
                    <p className="text-sm text-gray-600">You'll see a red "LIVE" badge appear when you're connected (usually takes just a few seconds)</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">That's it! You're live</p>
                    <p className="text-sm text-gray-600">Your class automatically becomes visible to students. Start teaching!</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">When you're done</p>
                    <p className="text-sm text-gray-600">Click "Stop Broadcast" — your class ends and the recording is saved</p>
                  </li>
                </ol>
              </div>

              <Alert variant="info" className="mb-4">
                <p className="font-semibold mb-1">What happens when you click "Start Broadcast"?</p>
                <ul className="text-sm space-y-1 list-disc ml-4">
                  <li>Your camera and microphone turn on (you'll see yourself on screen)</li>
                  <li>The system connects you to the streaming servers</li>
                  <li>Your class automatically switches from "Scheduled" to "LIVE"</li>
                  <li>Students who enrolled can now watch your class</li>
                  <li>Your class appears in the "LIVE NOW" section on the Live Streams page</li>
                </ul>
              </Alert>

              <Alert variant="success">
                <p className="font-semibold mb-1">Browser Requirements</p>
                <p className="text-sm">
                  Works best in Chrome, Firefox, or Safari. Make sure you have a stable internet connection
                  (at least 5 Mbps upload speed recommended) and good lighting for the best experience.
                </p>
              </Alert>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ending your class</h3>
              <p className="text-gray-700 mb-4">
                When you're finished teaching, ending your class is just as simple as starting it.
              </p>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200 mb-6">
                <p className="font-bold text-gray-900 mb-4 text-lg">How to end your class:</p>
                <ol className="space-y-3 ml-6 list-decimal text-gray-700">
                  <li>
                    <p className="font-semibold text-gray-900">Click "Stop Broadcast" (or "End Stream" in the sidebar)</p>
                    <p className="text-sm text-gray-600">Both ask you to confirm first — so one accidental click can't end your class</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">Confirm</p>
                    <p className="text-sm text-gray-600">Your camera and microphone turn off and the class ends for everyone</p>
                  </li>
                  <li>
                    <p className="font-semibold text-gray-900">That's it!</p>
                    <p className="text-sm text-gray-600">Your class is now marked as ended and the recording is prepared automatically — usually ready within a few hours (up to a day)</p>
                  </li>
                </ol>
              </div>

              <Alert variant="info" className="mb-4">
                <p className="font-semibold mb-1">What happens when you end your class?</p>
                <ul className="text-sm space-y-1 list-disc ml-4">
                  <li>Your camera and microphone turn off</li>
                  <li>The class status changes from "LIVE" to "ENDED"</li>
                  <li>Students can no longer join the live class</li>
                  <li>The recording is prepared automatically (usually ready within a few hours, up to a day)</li>
                  <li>Enrolled students can watch the replay for 7 days</li>
                </ul>
              </Alert>

              <Alert variant="warning">
                <p className="font-semibold mb-1">Important: Recording Availability</p>
                <p className="text-sm">
                  Your class is automatically recorded while you broadcast. After you end the class,
                  the recording is prepared automatically — usually ready within a few hours (up to
                  a day) — and is then available to enrolled students for <strong>7 days</strong>. After that,
                  the replay closes and the recording may join the Lean Sporty on-demand library —
                  and you can reuse it as a lesson in your paid programs.
                </p>
              </Alert>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What if something goes wrong?</h3>
              <p className="text-gray-700 mb-4">
                Don't worry - we've built in resilience for common technical issues during your class.
              </p>

              <div className="space-y-4">
                <Alert variant="info">
                  <p className="font-semibold mb-2">Reconnecting After Connection Loss</p>
                  <p className="text-sm mb-3">
                    If your connection drops during class (battery dies, browser crashes, network issues, or accidental refresh),
                    you can easily reconnect without ending your class:
                  </p>
                  <ol className="text-sm space-y-2 ml-6 list-decimal">
                    <li>Open the broadcast page again (same device or different device)</li>
                    <li>You'll see a blue <strong>"Reconnect Broadcast"</strong> button instead of the pink "Start Broadcast"</li>
                    <li>Click it to continue your class from where you left off</li>
                    <li>Your original start time and analytics are preserved</li>
                    <li>Students stay enrolled and can continue watching</li>
                  </ol>
                  <p className="text-xs mt-3 font-medium">
                    Common scenarios: laptop battery dies, switch to phone, browser refresh, network drop, computer sleep
                  </p>
                </Alert>

                <Alert variant="warning">
                  <p className="font-semibold mb-1">Browser Warning Protection</p>
                  <p className="text-sm">
                    When your class is live, if you try to close the tab or refresh the page, your browser will warn you:
                    "Your stream is still live. Are you sure you want to leave?" This helps prevent accidental disconnections.
                  </p>
                </Alert>

                <Alert variant="warning">
                  <p className="font-semibold mb-1">Cannot Restart Ended Classes</p>
                  <p className="text-sm">
                    Once you've ended a class (by clicking "Stop Broadcast"), you cannot restart it.
                    This is intentional - each class should be a separate session with its own recording and analytics.
                    To teach again, simply schedule a new class.
                  </p>
                </Alert>
              </div>
            </div>

            <Alert variant="info">
              <p className="font-semibold mb-1">Easy Broadcasting</p>
              <p className="text-sm">
                No special software required - everything works directly in your browser!
                Just allow camera and microphone access and you're ready to broadcast.
              </p>
            </Alert>
          </div>
        </section>

        {/* Getting paid */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Getting paid</h2>
              <p className="text-gray-600">How teaching on Lean Sporty pays you</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">You set the price</h3>
              <p className="text-gray-700 mb-4">
                Paid classes and programs are live. When you schedule a class or
                publish a program, you set one price in euros — or make a class free.
                Students pay by card; we handle checkout, receipts, refunds, and
                access.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What you keep, and when it arrives</h3>
              <p className="text-gray-700 mb-3">
                You <strong>keep 80% of every sale after VAT</strong> (85% as a
                featured instructor) — your price includes VAT, which we pay to the
                tax office for you. Every sale shows up on your Earnings page the
                moment it happens, and we send your share{" "}
                <strong>once a month — automatically via Stripe, or by bank
                transfer</strong> (balances under €20
                roll into the next month). You&apos;re never out of pocket — you only
                ever earn on a sale.
              </p>
            </div>

            <Alert variant="info">
              <p className="font-semibold mb-1">Recordings keep earning</p>
              <p className="text-sm">
                Every live class you run is recorded automatically. Recordings grow
                the members&apos; library — and you can reuse them as lessons in your
                own paid programs, so one night of teaching keeps selling.
              </p>
            </Alert>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Best Practices for Success</h2>
              <p className="text-gray-600">Tips to maximize your enrollments and build a following</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Use a clear, professional profile photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Write a friendly, authentic bio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Mention certifications and experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Link your Instagram for social proof</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Class Creation Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Write descriptive, engaging titles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Clearly state fitness level required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>List equipment needed (if any)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Add a clear description so students know what to expect</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Scheduling Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Post classes at least 1 week in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Choose consistent days/times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Consider different time zones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Offer variety in class types</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">During Your Class</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Start on time and be prepared</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Welcome students and build energy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>Provide clear, safe instruction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">✓</span>
                  <span>End with cool down and thank you</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl border border-pink-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common questions</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I edit a class after creating it?</h3>
              <p className="text-gray-700">
                Yes. While a class is still scheduled, open "Classes" and click "Edit" to change its title,
                description, date/time, or duration. Once a class has gone live or ended, its details are locked.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens if I need to cancel a class?</h3>
              <p className="text-gray-700">
                On the "Classes" page, click "Cancel" on any scheduled class and confirm. The class is removed
                from students' view and its broadcast setup is torn down. Cancelling isn't available once a class is
                live or ended. Try to avoid cancellations when possible to maintain your reputation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do students find my classes?</h3>
              <p className="text-gray-700 mb-2">Students can discover your classes through:</p>
              <ul className="ml-6 list-disc text-gray-700 space-y-1">
                <li>The public Live Streams page (shows all upcoming and live classes)</li>
                <li>Your public instructor profile (@yourname)</li>
                <li>Direct links you share on social media</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I teach multiple classes at once?</h3>
              <p className="text-gray-700">
                You can schedule as many classes as you want, but you can only broadcast one at a time.
                Make sure your class times don't overlap!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do I need special equipment?</h3>
              <p className="text-gray-700 mb-2">
                You only need basic equipment to broadcast:
              </p>
              <ul className="ml-6 list-disc text-gray-700 space-y-1">
                <li>A computer, tablet, or phone with a camera</li>
                <li>Built-in or external microphone</li>
                <li>Stable internet connection (5+ Mbps upload recommended)</li>
                <li>Modern web browser (Chrome, Firefox, or Safari)</li>
                <li>Good lighting (natural light or a ring light works great)</li>
              </ul>
              <p className="text-gray-700 mt-2">
                No special broadcasting software is needed - everything works directly in your browser!
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Will my classes be recorded?</h3>
              <p className="text-gray-700">
                Yes! Classes are recorded automatically. The recording is usually ready within a few
                hours (up to a day) after class ends, and enrolled students can rewatch it for 7 days.
                This adds value to your classes as students can revisit the workout.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I update my profile?</h3>
              <p className="text-gray-700">
                Click "Profile" in the instructor navigation (top of page), or go directly to the profile page
                from your dashboard. Changes are saved immediately and update your public profile.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can students contact me directly?</h3>
              <p className="text-gray-700">
                Not yet, but a messaging system is planned! For now, students can find you through your social media
                links (Instagram, website) that you add to your profile.
              </p>
            </div>
          </div>
        </section>

        {/* Need More Help */}
        <section className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-semibold mb-3">Still Have Questions?</h2>
          <p className="text-pink-50 mb-6 max-w-2xl mx-auto">
            We're here to help! Reach out to the Lean Sporty team for support, feedback, or suggestions.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Contact Support
          </a>
        </section>

      </div>
    </div>
  );
}
